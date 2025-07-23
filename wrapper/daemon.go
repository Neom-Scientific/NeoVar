package main

import (
    "bufio"
    "fmt"
    "io"
    "os"
    "os/exec"
    "regexp"
    "strings"
    "path/filepath"
    "golang.org/x/sys/unix"
)

func main() {
    if len(os.Args) < 9 {
        fmt.Println("Usage: ramfiles <call_batch.sh> <NeoVar.sh> <inputDir> <outputDir> <bed> <interval_list> <localDir> <logPath>")
        os.Exit(1)
    }

    // Only scripts in fileArgs, rest in scriptArgs
    fileArgs := os.Args[1:3]      // [call_batch.sh, NeoVar.sh]
    scriptArgs := os.Args[3:]     // [inputDir, outputDir, bed, interval_list, localDir, logPath]

    var openFiles []*os.File
    var ramPaths []string

    // Load scripts into memfd
    for _, path := range fileArgs {
        data, err := os.ReadFile(path)
        if err != nil {
            fmt.Fprintf(os.Stderr, "Error reading file %s: %v\n", path, err)
            os.Exit(1)
        }
        fd, err := unix.MemfdCreate("ramfile", unix.MFD_CLOEXEC)
        if err != nil {
            fmt.Fprintf(os.Stderr, "Error creating memfd for %s: %v\n", path, err)
            os.Exit(1)
        }
        osf := os.NewFile(uintptr(fd), path)
        _, err = osf.Write(data)
        if err != nil {
            fmt.Fprintf(os.Stderr, "Error writing to memfd for %s: %v\n", path, err)
            os.Exit(1)
        }
        if _, err := osf.Seek(0, 0); err != nil {
            fmt.Fprintf(os.Stderr, "Error seeking memfd for %s: %v\n", path, err)
            os.Exit(1)
        }
        openFiles = append(openFiles, osf)
        ramPaths = append(ramPaths, fmt.Sprintf("/proc/self/fd/%d", 3+len(openFiles)-1))
    }

    // Open log file (this is the main log file path passed from backend)
    fd, err := unix.MemfdCreate("mainlog", unix.MFD_CLOEXEC)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error creating memfd for main log: %v\n", err)
        os.Exit(1)
    }
    logFile := os.NewFile(uintptr(fd), "")
    defer logFile.Close()

    // Command to run
    cmd := exec.Command(
        ramPaths[0],          // call_batch.sh (memfd)
        ramPaths[1],          // NeoVar.sh (memfd)
        scriptArgs[0],        // inputDir
        scriptArgs[1],        // outputDir
        scriptArgs[2],        // bed file (direct path)
        scriptArgs[3],        // interval_list file (direct path)
        scriptArgs[4],        // localDir
    )

    cmd.ExtraFiles = openFiles
    stdout, _ := cmd.StdoutPipe()
    stderr, _ := cmd.StderrPipe()

    fmt.Printf("Executing: %s\n", cmd.String())
    fmt.Printf("ExtraFiles: %v\n", fileArgs)

    if err := cmd.Start(); err != nil {
        fmt.Fprintf(os.Stderr, "Failed to start process: %v\n", err)
        os.Exit(1)
    }

    fmt.Printf("logPath: %s\n", scriptArgs[5])
    go splitLogsBySample(stdout, logFile)
    go splitLogsBySample(stderr, logFile)

    cmd.Wait()

    err = cmd.Process.Release()
    if err != nil {
        fmt.Fprintf(os.Stderr, "Failed to detach process: %v\n", err)
        os.Exit(1)
    }
    fmt.Printf("Background process started with PID: %d\n", cmd.Process.Pid)
}

func extractSampleNameFromLogPath(logPath string) string {
    base := filepath.Base(logPath)
    // Assumes log file is named like PRJ-20250701-14_1324005728_S408_L007_R.log
    parts := strings.SplitN(base, "_", 2)
    if len(parts) == 2 {
        return strings.TrimSuffix(parts[1], ".log")
    }
    return ""
}

func splitLogsBySample(r io.Reader, mainLogFile *os.File) {
    os.MkdirAll("/dev/shm/.logs", 0755)

    scanner := bufio.NewScanner(r)
    var sampleLogFile *os.File
    var currentSample string
    sampleRe := regexp.MustCompile(`sampleName:\s*(\S+)`)
    vcfDoneRe := regexp.MustCompile(`VCF filtering completed\. Output: (\S+)_filtered\.vcf\.gz`)

    for scanner.Scan() {
        line := scanner.Text()

        // Always write to the main log file
        mainLogFile.WriteString(line + "\n")

        // Detect start of a new sample
        if matches := sampleRe.FindStringSubmatch(line); matches != nil {
            if sampleLogFile != nil {
                sampleLogFile.Close()
            }
            currentSample = matches[1]
            // Remove trailing _R if present
            baseSample := currentSample
            if strings.HasSuffix(baseSample, "_R") {
                baseSample = strings.TrimSuffix(baseSample, "_R")
            }
            logPath := fmt.Sprintf("/dev/shm/.logs/%s.log", baseSample)
            var err error
            sampleLogFile, err = os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
            if err != nil {
                fmt.Fprintf(os.Stderr, "Error opening sample log file: %v\n", err)
                sampleLogFile = nil
            }
        }

        // Write to current sample's log file if open
        if sampleLogFile != nil {
            sampleLogFile.WriteString(line + "\n")
        }

        // Detect end of sample processing
        if matches := vcfDoneRe.FindStringSubmatch(line); matches != nil && sampleLogFile != nil {
            sampleLogFile.Close()
            sampleLogFile = nil
            currentSample = ""
        }
    }
}
